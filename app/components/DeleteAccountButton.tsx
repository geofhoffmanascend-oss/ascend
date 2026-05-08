'use client'

export function DeleteAccountButton() {
  async function handleDelete() {
    if (!confirm('Delete your account? This cannot be undone.')) return
    await fetch('/api/account', { method: 'DELETE' })
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-ash hover:text-brand-red transition-colors"
    >
      Delete account (dev)
    </button>
  )
}
