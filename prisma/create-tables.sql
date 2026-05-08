-- Run once to create all tables (enums already created by prisma db push)

CREATE TABLE IF NOT EXISTS "User" (
  "id"               STRING        NOT NULL,
  "name"             STRING,
  "email"            STRING        NOT NULL,
  "emailVerified"    TIMESTAMP,
  "image"            STRING,
  "passwordHash"     STRING,
  "role"             "Role"        NOT NULL DEFAULT 'student',
  "onboardingDone"   BOOL          NOT NULL DEFAULT false,
  "bio"              STRING,
  "phone"            STRING,
  "emergencyContact" STRING,
  "avatarUrl"        STRING,
  "belt"             "Belt"        NOT NULL DEFAULT 'white',
  "stripes"          INT8          NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP     NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMP     NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id"                STRING  NOT NULL,
  "userId"            STRING  NOT NULL,
  "type"              STRING  NOT NULL,
  "provider"          STRING  NOT NULL,
  "providerAccountId" STRING  NOT NULL,
  "refresh_token"     STRING,
  "access_token"      STRING,
  "expires_at"        INT8,
  "token_type"        STRING,
  "scope"             STRING,
  "id_token"          STRING,
  "session_state"     STRING,
  PRIMARY KEY ("id"),
  UNIQUE ("provider", "providerAccountId"),
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id"           STRING    NOT NULL,
  "sessionToken" STRING    NOT NULL,
  "userId"       STRING    NOT NULL,
  "expires"      TIMESTAMP NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("sessionToken"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" STRING NOT NULL,
  "token"      STRING NOT NULL,
  "expires"    TIMESTAMP NOT NULL,
  UNIQUE ("token"),
  UNIQUE ("identifier", "token")
);

CREATE TABLE IF NOT EXISTS "Class" (
  "id"          STRING      NOT NULL,
  "instructorId" STRING     NOT NULL,
  "title"       STRING      NOT NULL,
  "description" STRING,
  "type"        "ClassType" NOT NULL DEFAULT 'gi',
  "dayOfWeek"   "DayOfWeek" NOT NULL,
  "startTime"   STRING      NOT NULL,
  "endTime"     STRING      NOT NULL,
  "location"    STRING,
  "isActive"    BOOL        NOT NULL DEFAULT true,
  "maxStudents" INT8,
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP   NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "Class_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "ClassSession" (
  "id"         STRING    NOT NULL,
  "classId"    STRING    NOT NULL,
  "date"       DATE      NOT NULL,
  "cancelled"  BOOL      NOT NULL DEFAULT false,
  "cancelNote" STRING,
  "notes"      STRING,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("classId", "date"),
  CONSTRAINT "ClassSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Commitment" (
  "id"             STRING            NOT NULL,
  "userId"         STRING            NOT NULL,
  "classSessionId" STRING            NOT NULL,
  "status"         "CommitmentStatus" NOT NULL DEFAULT 'committed',
  "weightClass"    STRING,
  "createdAt"      TIMESTAMP         NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMP         NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("userId", "classSessionId"),
  CONSTRAINT "Commitment_userId_fkey"         FOREIGN KEY ("userId")         REFERENCES "User"("id")         ON DELETE CASCADE,
  CONSTRAINT "Commitment_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Attendance" (
  "id"             STRING    NOT NULL,
  "userId"         STRING    NOT NULL,
  "classSessionId" STRING    NOT NULL,
  "attended"       BOOL      NOT NULL DEFAULT true,
  "markedById"     STRING    NOT NULL,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("userId", "classSessionId"),
  CONSTRAINT "Attendance_userId_fkey"         FOREIGN KEY ("userId")         REFERENCES "User"("id"),
  CONSTRAINT "Attendance_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Forum" (
  "id"          STRING      NOT NULL,
  "type"        "ForumType" NOT NULL,
  "classId"     STRING,
  "title"       STRING      NOT NULL,
  "description" STRING,
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("classId"),
  CONSTRAINT "Forum_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Post" (
  "id"        STRING     NOT NULL,
  "forumId"   STRING     NOT NULL,
  "authorId"  STRING     NOT NULL,
  "content"   STRING     NOT NULL,
  "type"      "PostType" NOT NULL DEFAULT 'text',
  "videoUrl"  STRING,
  "parentId"  STRING,
  "pinned"    BOOL       NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP  NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP  NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "Post_forumId_fkey"  FOREIGN KEY ("forumId")  REFERENCES "Forum"("id") ON DELETE CASCADE,
  CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id"),
  CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Post"("id")
);

CREATE TABLE IF NOT EXISTS "ForumSubscription" (
  "id"        STRING    NOT NULL,
  "userId"    STRING    NOT NULL,
  "forumId"   STRING    NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("userId", "forumId"),
  CONSTRAINT "ForumSubscription_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "User"("id")  ON DELETE CASCADE,
  CONSTRAINT "ForumSubscription_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "PrivateLesson" (
  "id"           STRING         NOT NULL,
  "requesterId"  STRING         NOT NULL,
  "instructorId" STRING         NOT NULL,
  "ukeId"        STRING,
  "scheduledAt"  TIMESTAMP      NOT NULL,
  "durationMins" INT8           NOT NULL DEFAULT 60,
  "status"       "LessonStatus" NOT NULL DEFAULT 'pending',
  "location"     STRING,
  "notes"        STRING,
  "price"        INT8,
  "createdAt"    TIMESTAMP      NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMP      NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "PrivateLesson_requesterId_fkey"  FOREIGN KEY ("requesterId")  REFERENCES "User"("id"),
  CONSTRAINT "PrivateLesson_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id"),
  CONSTRAINT "PrivateLesson_ukeId_fkey"        FOREIGN KEY ("ukeId")        REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "LessonMessage" (
  "id"        STRING    NOT NULL,
  "lessonId"  STRING    NOT NULL,
  "authorId"  STRING    NOT NULL,
  "content"   STRING    NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "LessonMessage_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "PrivateLesson"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "StudentGoal" (
  "id"          STRING    NOT NULL,
  "userId"      STRING    NOT NULL,
  "description" STRING    NOT NULL,
  "targetDate"  TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "StudentGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Competition" (
  "id"          STRING    NOT NULL,
  "userId"      STRING    NOT NULL,
  "name"        STRING    NOT NULL,
  "date"        DATE      NOT NULL,
  "location"    STRING,
  "division"    STRING,
  "weightClass" STRING,
  "result"      STRING,
  "notes"       STRING,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "Competition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "RankPromotion" (
  "id"           STRING    NOT NULL,
  "studentId"    STRING    NOT NULL,
  "promotedById" STRING    NOT NULL,
  "belt"         "Belt"    NOT NULL,
  "stripes"      INT8      NOT NULL,
  "date"         DATE      NOT NULL,
  "notes"        STRING,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "RankPromotion_studentId_fkey"    FOREIGN KEY ("studentId")    REFERENCES "User"("id"),
  CONSTRAINT "RankPromotion_promotedById_fkey" FOREIGN KEY ("promotedById") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "StudentNote" (
  "id"           STRING    NOT NULL,
  "studentId"    STRING    NOT NULL,
  "instructorId" STRING    NOT NULL,
  "content"      STRING    NOT NULL,
  "isPrivate"    BOOL      NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "StudentNote_studentId_fkey"    FOREIGN KEY ("studentId")    REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "StudentNote_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "LessonPlan" (
  "id"           STRING    NOT NULL,
  "instructorId" STRING    NOT NULL,
  "classId"      STRING,
  "title"        STRING    NOT NULL,
  "techniques"   STRING,
  "notes"        STRING,
  "videoUrls"    STRING,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "LessonPlan_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id"),
  CONSTRAINT "LessonPlan_classId_fkey"      FOREIGN KEY ("classId")      REFERENCES "Class"("id")
);
