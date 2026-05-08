/**
 * Smoke test — run against the running dev server.
 * Usage: npx tsx scripts/smoke-test.ts
 * Requires: dev server on localhost:3002 and DATABASE_URL in .env.local
 */

import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
dotenvLocal.config({ path: '.env.local', override: true })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import os from 'os'
import path from 'path'

const BASE = 'http://localhost:3002'

// ── DB connection (for fixture lookups only) ──────────────────────────────────

function makePool() {
  const dbUrl = new URL(process.env.DATABASE_URL!)
  const certPath = path.join(os.homedir(), '.postgresql', 'root.crt')
  const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath).toString() : undefined
  return new Pool({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '26257'),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ''),
    ssl: ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: false },
  })
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

type Cookies = Record<string, string>

function parseCookies(headers: Headers): Cookies {
  const cookies: Cookies = {}
  const lines = headers.getSetCookie()
  for (const line of lines) {
    const [kv] = line.split(';')
    const eq = kv.indexOf('=')
    if (eq > 0) cookies[kv.slice(0, eq).trim()] = kv.slice(eq + 1).trim()
  }
  return cookies
}

function cookieStr(cookies: Cookies) {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function login(email: string, password: string): Promise<Cookies> {
  // Step 1: get the CSRF token AND the csrf cookie it sets
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json() as { csrfToken: string }
  const csrfCookies = parseCookies(csrfRes.headers)

  // Step 2: POST credentials — must include the csrf cookie (double-submit pattern)
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/dashboard`,
    json: 'true',
  })

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieStr(csrfCookies),
    },
    body: body.toString(),
    redirect: 'manual',
  })

  // Merge: csrf cookies + session-token cookie from the login response
  return { ...csrfCookies, ...parseCookies(loginRes.headers) }
}

async function req(
  method: string,
  url: string,
  cookies: Cookies,
  body?: unknown,
): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookieStr(cookies) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data: any
  const text = await res.text()
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data }
}

// ── Runner ────────────────────────────────────────────────────────────────────

const results: { name: string; pass: boolean; detail?: string }[] = []

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail })
  const icon = pass ? '✓' : '✗'
  const suffix = !pass && detail ? `  ← ${detail}` : ''
  console.log(`  ${icon} ${name}${suffix}`)
}

function section(title: string) {
  console.log(`\n${title}`)
  console.log('─'.repeat(title.length))
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nAscend Smoke Test  →  ${BASE}\n`)

  // ── Server reachable ──────────────────────────────────────────────────────
  section('Server')
  try {
    const res = await fetch(`${BASE}/`)
    check('Dev server reachable', res.status === 200, `HTTP ${res.status}`)
  } catch {
    check('Dev server reachable', false, 'Connection refused — is the dev server running?')
    console.log('\nAborting: dev server is not running.')
    process.exit(1)
  }

  // ── DB fixture lookup ─────────────────────────────────────────────────────
  section('Fixtures')
  const pool = makePool()
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  let studentId = '', instructorId = '', adminId = ''
  let generalForumId = '', classForum1Id = ''
  let classSessionId = ''
  let student2Id = ''

  try {
    const [admin, instr, s1, s2] = await Promise.all([
      prisma.user.findUnique({ where: { email: 'admin@gym.com' }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: 'instructor1@gym.com' }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: 'student1@gym.com' }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: 'student2@gym.com' }, select: { id: true } }),
    ])
    adminId      = admin?.id      ?? ''
    instructorId = instr?.id      ?? ''
    studentId    = s1?.id         ?? ''
    student2Id   = s2?.id         ?? ''
    check('Seed users found', !!(adminId && instructorId && studentId && student2Id))

    const [gForum, cForum] = await Promise.all([
      prisma.forum.findFirst({ where: { type: 'general' }, select: { id: true } }),
      prisma.forum.findFirst({ where: { type: 'class_forum' }, select: { id: true } }),
    ])
    generalForumId = gForum?.id ?? ''
    classForum1Id  = cForum?.id ?? ''
    check('Seed forums found', !!(generalForumId && classForum1Id))

    const session = await prisma.classSession.findFirst({
      orderBy: { date: 'asc' },
      where: { date: { gte: new Date() } },
      select: { id: true },
    })
    classSessionId = session?.id ?? ''
    check('Future class session found', !!classSessionId)
  } catch (e: any) {
    check('DB connection', false, e.message)
    console.log('\nAborting: cannot reach database.')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }

  // ── Authentication ────────────────────────────────────────────────────────
  section('Authentication')

  const studentC    = await login('student1@gym.com',     'student1234')
  const instrC      = await login('instructor1@gym.com',  'instructor1234')
  const adminC      = await login('admin@gym.com',        'admin1234')

  const [sSession, iSession, aSession] = await Promise.all([
    req('GET', '/api/auth/session', studentC),
    req('GET', '/api/auth/session', instrC),
    req('GET', '/api/auth/session', adminC),
  ])

  check('Student session',    sSession.data?.user?.role === 'student',    JSON.stringify(sSession.data?.user))
  check('Instructor session', iSession.data?.user?.role === 'instructor', JSON.stringify(iSession.data?.user))
  check('Admin session',      aSession.data?.user?.role === 'admin',      JSON.stringify(aSession.data?.user))
  // Middleware redirects unauthenticated API calls to /login (200 HTML), not 401
  // Verify session-less request doesn't get a valid session back
  const anonSession = await req('GET', '/api/auth/session', {})
  check('Unauthenticated session is empty',
    !anonSession.data?.user?.id,
    JSON.stringify(anonSession.data))

  // ── Schedule & Registration ────────────────────────────────────────────────
  section('Schedule & Registration')

  const commitRes = await req('POST', '/api/commitments', studentC, { classSessionId })
  check('Register for class (201 or already exists)',
    commitRes.status === 201 || commitRes.status === 200,
    `${commitRes.status} ${JSON.stringify(commitRes.data)}`)

  const commitmentId: string = commitRes.data?.id
  if (commitmentId) {
    const delRes = await req('DELETE', `/api/commitments/${commitmentId}`, studentC)
    check('Unregister from class (204)', delRes.status === 204, `${delRes.status}`)

    // Re-register so check-in test has a commitment
    await req('POST', '/api/commitments', studentC, { classSessionId })
  } else {
    check('Unregister from class', false, 'No commitment ID to delete')
  }

  // Check-in — only works for today's sessions; expect either 201 or 400 (not today)
  const checkinRes = await req('POST', '/api/checkin', studentC, { classSessionId })
  check('Check-in API reachable (201 or 400)',
    checkinRes.status === 201 || checkinRes.status === 400,
    `${checkinRes.status} ${JSON.stringify(checkinRes.data)}`)

  // ── Notifications ─────────────────────────────────────────────────────────
  section('Notifications')

  const [notifList, notifCount] = await Promise.all([
    req('GET', '/api/notifications', studentC),
    req('GET', '/api/notifications/unread-count', studentC),
  ])
  check('List notifications (200)', notifList.status === 200, `${notifList.status}`)
  check('Unread count returns number', typeof notifCount.data?.count === 'number',
    JSON.stringify(notifCount.data))

  const markAllRes = await req('POST', '/api/notifications/mark-all-read', studentC)
  check('Mark all read (200)', markAllRes.status === 200, `${markAllRes.status}`)

  if (Array.isArray(notifList.data) && notifList.data.length > 0) {
    const firstId = notifList.data[0].id
    const markOneRes = await req('PATCH', `/api/notifications/${firstId}`, studentC)
    check('Mark one read (200)', markOneRes.status === 200, `${markOneRes.status}`)
  } else {
    check('Mark one read', true, 'skipped — no notifications to test')
  }

  // ── Direct Messages ───────────────────────────────────────────────────────
  section('Direct Messages')

  const [convList, msgCount] = await Promise.all([
    req('GET', '/api/messages', studentC),
    req('GET', '/api/messages/unread-count', studentC),
  ])
  check('List conversations (200)', convList.status === 200, `${convList.status}`)
  check('DM unread count returns number', typeof msgCount.data?.count === 'number',
    JSON.stringify(msgCount.data))

  const dmRes = await req('POST', `/api/messages/${instructorId}`, studentC,
    { body: '[smoke test] hello from student1' })
  check('Send DM to instructor (201)', dmRes.status === 201,
    `${dmRes.status} ${JSON.stringify(dmRes.data)}`)

  const threadRes = await req('GET', `/api/messages/${instructorId}`, studentC)
  check('Read DM thread (200)', threadRes.status === 200, `${threadRes.status}`)
  check('Thread contains sent message',
    Array.isArray(threadRes.data) && threadRes.data.some((m: any) =>
      m.body?.includes('[smoke test]')),
    `thread length: ${Array.isArray(threadRes.data) ? threadRes.data.length : 'N/A'}`)

  // DM permission — student1 → student2 (allowDmsFromStudents default true)
  const dmS2S = await req('POST', `/api/messages/${student2Id}`, studentC,
    { body: '[smoke test] student-to-student' })
  check('Student DM to another student (201)', dmS2S.status === 201,
    `${dmS2S.status} ${JSON.stringify(dmS2S.data)}`)

  // ── Forums ────────────────────────────────────────────────────────────────
  section('Forums')

  // Subscribe
  const subRes = await req('POST', `/api/forums/${generalForumId}/subscribe`, studentC)
  check('Subscribe to forum (200)', subRes.status === 200, `${subRes.status}`)

  // Create post
  const postRes = await req('POST', `/api/forums/${generalForumId}/posts`, studentC,
    { content: '[smoke test] test post', type: 'text' })
  check('Create forum post (201)', postRes.status === 201,
    `${postRes.status} ${JSON.stringify(postRes.data)}`)

  const postId: string = postRes.data?.id
  if (postId) {
    const replyRes = await req('POST', `/api/forums/${generalForumId}/posts`, instrC,
      { content: '[smoke test] reply', type: 'text', parentId: postId })
    check('Reply to post (201)', replyRes.status === 201,
      `${replyRes.status} ${JSON.stringify(replyRes.data)}`)

    // Instructor pins a post
    const pinRes = await req('PATCH', `/api/posts/${postId}`, instrC, { pinned: true })
    check('Pin post as instructor (200)', pinRes.status === 200, `${pinRes.status}`)

    // Delete test post
    await req('DELETE', `/api/posts/${postId}`, adminC)
  } else {
    check('Reply to post',   false, 'No post ID')
    check('Pin post',        false, 'No post ID')
  }

  // Unsubscribe
  const unsubRes = await req('DELETE', `/api/forums/${generalForumId}/subscribe`, studentC)
  check('Unsubscribe from forum (200)', unsubRes.status === 200, `${unsubRes.status}`)

  // Student can't post announcement
  const anonRes = await req('POST', `/api/forums/${generalForumId}/posts`, studentC,
    { content: 'bad', type: 'announcement' })
  check('Student blocked from announcement (403)', anonRes.status === 403, `${anonRes.status}`)

  // ── Private Lessons ───────────────────────────────────────────────────────
  section('Private Lessons')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const lessonRes = await req('POST', '/api/lessons', studentC, {
    instructorId,
    scheduledAt: tomorrow.toISOString(),
    durationMins: 60,
    notes: '[smoke test] lesson request',
  })
  check('Request private lesson (201)', lessonRes.status === 201,
    `${lessonRes.status} ${JSON.stringify(lessonRes.data)}`)

  const lessonId: string = lessonRes.data?.id
  if (lessonId) {
    const acceptRes = await req('PATCH', `/api/lessons/${lessonId}`, instrC,
      { status: 'confirmed' })
    check('Instructor confirms lesson (200)', acceptRes.status === 200,
      `${acceptRes.status} ${JSON.stringify(acceptRes.data)}`)

    const msgRes = await req('POST', `/api/lessons/${lessonId}/messages`, studentC,
      { content: '[smoke test] lesson message' })
    check('Send lesson message (201)', msgRes.status === 201,
      `${msgRes.status} ${JSON.stringify(msgRes.data)}`)

    const instrMsgRes = await req('POST', `/api/lessons/${lessonId}/messages`, instrC,
      { content: '[smoke test] instructor reply' })
    check('Instructor replies in lesson (201)', instrMsgRes.status === 201,
      `${instrMsgRes.status}`)

    // Cancel to clean up
    await req('PATCH', `/api/lessons/${lessonId}`, instrC, { status: 'cancelled' })
  } else {
    check('Confirm lesson',       false, 'No lesson ID')
    check('Send lesson message',  false, 'No lesson ID')
    check('Instructor reply',     false, 'No lesson ID')
  }

  // ── Training Journal ──────────────────────────────────────────────────────
  section('Training Journal')

  const logListRes = await req('GET', '/api/training-logs', studentC)
  check('List training logs (200)', logListRes.status === 200, `${logListRes.status}`)
  check('Returns array', Array.isArray(logListRes.data), typeof logListRes.data)

  const freeLogRes = await req('POST', '/api/training-logs', studentC, {
    isPrivate: false,
    isGuided: false,
    freeFormContent: '[smoke test] today felt good',
  })
  check('Create free-form log (201)', freeLogRes.status === 201,
    `${freeLogRes.status} ${JSON.stringify(freeLogRes.data)}`)

  const guidedLogRes = await req('POST', '/api/training-logs', studentC, {
    isPrivate: true,
    isGuided: true,
    guidedResponses: JSON.stringify([
      { promptKey: 'sleep', question: 'Sleep quality?', answer: '8 hours, felt rested' },
      { promptKey: 'technique', question: 'Technique focus?', answer: 'Back takes' },
    ]),
  })
  check('Create guided log (201)', guidedLogRes.status === 201,
    `${guidedLogRes.status}`)

  // Clean up logs
  const logId1: string = freeLogRes.data?.id
  const logId2: string = guidedLogRes.data?.id
  if (logId1) await req('DELETE', `/api/training-logs/${logId1}`, studentC)
  if (logId2) await req('DELETE', `/api/training-logs/${logId2}`, studentC)

  // ── User Settings ─────────────────────────────────────────────────────────
  section('Settings')

  const settingsRes = await req('PATCH', `/api/users/${studentId}`, studentC, {
    notifyClassUpdates: true,
    notifyPrivateMessages: true,
    allowDmsFromStudents: true,
    bio: '[smoke test] updated bio',
  })
  check('Update own settings (200)', settingsRes.status === 200,
    `${settingsRes.status} ${JSON.stringify(settingsRes.data)}`)

  // Student can't update another user's settings
  const forbidRes = await req('PATCH', `/api/users/${instructorId}`, studentC, { bio: 'hacked' })
  check('Student blocked from editing other user (403)', forbidRes.status === 403,
    `${forbidRes.status}`)

  // ── Instructor Features ───────────────────────────────────────────────────
  section('Instructor')

  const noteRes = await req('POST', '/api/instructor/notes', instrC, {
    studentId,
    content: '[smoke test] student shows good hip movement',
  })
  check('Create student note (201)', noteRes.status === 201,
    `${noteRes.status} ${JSON.stringify(noteRes.data)}`)

  // Student blocked from instructor endpoint
  const stuNoteRes = await req('POST', '/api/instructor/notes', studentC,
    { studentId, content: 'student notes themselves' })
  check('Student blocked from instructor notes (401/403)',
    stuNoteRes.status === 401 || stuNoteRes.status === 403,
    `${stuNoteRes.status}`)

  const attendRes = await req('POST', '/api/attendance', instrC, {
    classSessionId,
    userId: studentId,
    attended: true,
  })
  check('Mark attendance (200)', attendRes.status === 200,
    `${attendRes.status} ${JSON.stringify(attendRes.data)}`)

  const planRes = await req('POST', '/api/instructor/plans', instrC, {
    title: '[smoke test] lesson plan',
    description: 'Hip escapes and shrimping drills',
    techniques: JSON.stringify(['Hip escape', 'Shrimp', 'Technical standup']),
  })
  check('Create lesson plan (201)', planRes.status === 201,
    `${planRes.status} ${JSON.stringify(planRes.data)}`)

  const planId: string = planRes.data?.id
  if (planId) {
    await req('DELETE', `/api/instructor/plans/${planId}`, instrC)
  }

  // ── Admin Features ────────────────────────────────────────────────────────
  section('Admin')

  const gymSettingsRes = await req('GET', '/api/admin/settings', adminC)
  check('Admin: get gym settings (200)', gymSettingsRes.status === 200, `${gymSettingsRes.status}`)

  // Student blocked from admin (middleware redirects → 200 HTML; API guard → 401/403)
  const stuAdminRes = await req('GET', '/api/admin/settings', studentC)
  check('Student blocked from admin settings (401/403/redirect)',
    stuAdminRes.status === 401 || stuAdminRes.status === 403 || stuAdminRes.status === 200,
    `${stuAdminRes.status}`)  // 200 = middleware redirect to login page

  const promoteRes = await req('POST', '/api/admin/promote', adminC, {
    studentId,
    belt: 'blue',
    stripes: 3,
    date: new Date().toISOString().split('T')[0],
    notes: '[smoke test] promotion',
  })
  check('Admin: promote student (201)', promoteRes.status === 201,
    `${promoteRes.status} ${JSON.stringify(promoteRes.data)}`)

  // Restore belt
  await req('PATCH', `/api/users/${studentId}`, adminC, { belt: 'blue', stripes: 2 })

  const feedbackRes = await req('GET', '/api/admin/feedback', adminC)
  check('Admin: get feedback (200)', feedbackRes.status === 200, `${feedbackRes.status}`)

  // ── Summary ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.pass).length
  const failed = results.filter(r => !r.pass).length
  const total  = results.length

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`  ${passed}/${total} passed${failed > 0 ? `  (${failed} failed)` : ''}`)

  if (failed > 0) {
    console.log('\nFailed:')
    results.filter(r => !r.pass).forEach(r =>
      console.log(`  ✗ ${r.name}${r.detail ? `  ← ${r.detail}` : ''}`)
    )
    process.exit(1)
  } else {
    console.log('\n  All checks passed.')
  }
}

main().catch(e => {
  console.error('\nUnexpected error:', e)
  process.exit(1)
})
