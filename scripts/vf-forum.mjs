import { chromium } from 'playwright'
const B='http://localhost:3002'
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1100,height:1000}})).newPage()
await p.goto(`${B}/login`,{waitUntil:'networkidle'})
await p.fill('input[type="email"]','instructor1@gym.com'); await p.fill('input[type="password"]','instructor1234')
await Promise.all([p.waitForURL(/dashboard/,{timeout:15000}).catch(()=>{}),p.click('button[type="submit"]')])
await p.waitForTimeout(800)
await p.goto(`${B}/forum`,{waitUntil:'networkidle'}); await p.waitForTimeout(500)
const body=(await p.textContent('body'))||''
console.log('DMV Jiu-Jitsu present:', body.includes('DMV Jiu-Jitsu')?'yes ✓':'no ✗')
console.log('Ascend Jiu Jitsu section:', body.includes('Ascend Jiu Jitsu')?'yes ✓':'no ✗')
console.log('6am Crew present:', body.includes('6am Crew')?'yes ✓':'no ✗')
await p.screenshot({path:'/tmp/uiverify/forum-list.png',fullPage:true})
await b.close()
