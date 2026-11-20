import { useMemo, useState } from 'react'
import { Crown, Loader2, ShieldCheck, Sparkles, UserPlus, Users } from 'lucide-react'
import { useMusicStore } from '@/stores/useMusicStore'
import { PlanBadge } from '@/components/PlanBadge'
import { isPlanId } from '@/lib/plans'
import { formatDate, formatNumber } from '@/lib/media'
import { AdminSearch, EmptyState, PageIntro } from './AdminUI'

const UsersTabContent = () => {
  const { users, updateUserPlan } = useMusicStore()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  const handlePlanChange = async (id: string, plan: string) => {
    setSavingId(id)
    setError(null)
    const saved = await updateUserPlan(id, plan)
    if (!saved) setError('Could not update that plan. Please try again.')
    setSavingId(null)
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      if (planFilter !== 'all' && (isPlanId(user.plan) ? user.plan : 'free') !== planFilter) return false
      if (!query) return true
      return [user.fullName, user.email, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [users, search, planFilter])

  const summary = useMemo(() => {
    const paid = users.filter((user) => (isPlanId(user.plan) ? user.plan : 'free') !== 'free').length
    const admins = users.filter((user) => user.role === 'admin').length
    const now = new Date()
    const newThisMonth = users.filter((user) => {
      if (!user.createdAt) return false
      const date = new Date(user.createdAt)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
    return { paid, admins, newThisMonth }
  }, [users])

  return (
    <div className='space-y-6'>
      <PageIntro
        eyebrow='Audience'
        title='Users'
        description='Manage listener accounts and subscription plans. Plan changes take effect immediately.'
        icon={Users}
        accent='text-blue-400'
      />

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {[
          { label: 'Total users', value: formatNumber(users.length), icon: Users, accent: 'text-blue-400' },
          { label: 'Paid members', value: formatNumber(summary.paid), icon: Crown, accent: 'text-amber-300' },
          { label: 'Admins', value: formatNumber(summary.admins), icon: ShieldCheck, accent: 'text-[#1ed760]' },
          { label: 'Joined this month', value: formatNumber(summary.newThisMonth), icon: UserPlus, accent: 'text-violet-400' },
        ].map((item) => (
          <div key={item.label} className='rounded-2xl border border-white/[0.07] bg-[#181818] p-4'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold text-zinc-500'>{item.label}</p>
              <item.icon className={`size-4 ${item.accent}`} />
            </div>
            <p className='mt-2 text-2xl font-bold text-white'>{item.value}</p>
          </div>
        ))}
      </div>

      <section className='overflow-hidden rounded-2xl border border-white/[0.07] bg-[#181818]'>
        <div className='flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between'>
          <AdminSearch value={search} onChange={setSearch} placeholder='Search users by name or email...' />
          <select
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            aria-label='Filter by plan'
            className='h-10 rounded-full border border-white/10 bg-[#202020] px-3.5 text-xs font-semibold text-zinc-300 outline-none focus:border-[#1ed760]/60'
          >
            <option value='all'>All plans</option>
            <option value='free'>Normal</option>
            <option value='basic'>Basic</option>
            <option value='premium'>Premium</option>
            <option value='pro'>Pro</option>
          </select>
        </div>

        {error && (
          <div className='border-b border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300'>{error}</div>
        )}

        {filtered.length ? (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-left text-sm'>
              <thead>
                <tr className='border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-zinc-500'>
                  <th className='px-4 py-3 font-semibold'>User</th>
                  <th className='px-4 py-3 font-semibold'>Email</th>
                  <th className='px-4 py-3 font-semibold'>Plan</th>
                  <th className='px-4 py-3 font-semibold'>Role</th>
                  <th className='px-4 py-3 font-semibold'>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const plan = isPlanId(user.plan) ? user.plan : 'free'
                  return (
                    <tr key={user._id} className='border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]'>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          {user.imageUrl ? (
                            <img src={user.imageUrl} alt={user.fullName} className='size-10 rounded-full object-cover ring-1 ring-white/10' />
                          ) : (
                            <div className='grid size-10 place-items-center rounded-full bg-[#242424] text-zinc-400'>
                              <Users className='size-5' />
                            </div>
                          )}
                          <div className='min-w-0'>
                            <p className='truncate font-semibold text-white'>{user.fullName}</p>
                            <p className='truncate text-xs text-zinc-500 md:hidden'>{user.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3 text-zinc-400'>{user.email || '-'}</td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2'>
                          <PlanBadge plan={plan} size='xs' withIcon={false} />
                          <div className='relative'>
                            <select
                              value={plan}
                              onChange={(event) => handlePlanChange(user._id, event.target.value)}
                              disabled={savingId === user._id}
                              aria-label={`Change plan for ${user.fullName}`}
                              className='rounded-full border border-white/10 bg-[#202020] px-2.5 py-1 text-xs font-semibold text-white outline-none focus:border-[#1ed760] disabled:opacity-60'
                            >
                              <option value='free'>Normal</option>
                              <option value='basic'>Basic</option>
                              <option value='premium'>Premium</option>
                              <option value='pro'>Pro</option>
                            </select>
                            {savingId === user._id && (
                              <Loader2 className='absolute -right-5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-zinc-400' />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={
                            user.role === 'admin'
                              ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300'
                              : 'inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-zinc-400'
                          }
                        >
                          {user.role === 'admin' && <ShieldCheck className='size-3' />}
                          {user.role}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-zinc-500'>{formatDate(user.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='p-5'>
            <EmptyState
              icon={Sparkles}
              title={users.length ? 'No users match your filters' : 'No users have registered yet'}
              description={users.length ? 'Try a different search term or plan filter.' : 'New listener accounts will appear here after registration.'}
            />
          </div>
        )}
      </section>
    </div>
  )
}

export default UsersTabContent
