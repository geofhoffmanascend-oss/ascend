// Forum types broadly visible to any authenticated user. Used by the activity feed,
// follower-post notifications, and the public-profile post history so we never surface
// restricted content (class_forum, gym_forum, instructor_only, private_lesson).
export const PUBLIC_FORUM_TYPES = ['general', 'announcement', 'belt_forum', 'group_forum'] as const
