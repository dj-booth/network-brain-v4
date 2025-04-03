'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Database } from '@/types/supabase'
import Link from 'next/link'
import { Checkbox } from '../components/ui/checkbox'

type Profile = Database['public']['Tables']['profiles']['Row']

export const columns: ColumnDef<Profile>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      sticky: 'left',
    },
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => {
      const id = row.getValue('id') as string
      return (
        <div className="truncate max-w-[100px]" title={id}>
          {id.substring(0, 8)}...
        </div>
      )
    },
    enableColumnFilter: false,
    enableHiding: false,
  },
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => {
      const id = row.original.id
      return (
        <Link href={`/profiles/${id}`} className="font-medium text-blue-600 hover:underline">
          {row.getValue('full_name')}
        </Link>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.getValue('email') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.getValue('phone') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'linkedin',
    header: 'LinkedIn',
    cell: ({ row }) => {
      const linkedin = row.getValue('linkedin') as string | null
      return linkedin ? (
        <Link href={linkedin} target="_blank" className="text-blue-600 hover:underline">
          Profile
        </Link>
      ) : '—'
    },
    enableHiding: true,
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => row.getValue('location') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'referral_source',
    header: 'Referral Source',
    cell: ({ row }) => row.getValue('referral_source') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'current_plan',
    header: 'Current Plan',
    cell: ({ row }) => row.getValue('current_plan') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'startup_name',
    header: 'Startup Name',
    cell: ({ row }) => row.getValue('startup_name') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'cofounders_context',
    header: 'Cofounders Context',
    cell: ({ row }) => row.getValue('cofounders_context') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'startup_differentiator',
    header: 'Startup Differentiator',
    cell: ({ row }) => row.getValue('startup_differentiator') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'startup_validation',
    header: 'Startup Validation',
    cell: ({ row }) => row.getValue('startup_validation') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'job_search_preferences',
    header: 'Job Search Preferences',
    cell: ({ row }) => row.getValue('job_search_preferences') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'inspiring_companies',
    header: 'Inspiring Companies',
    cell: ({ row }) => row.getValue('inspiring_companies') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'hypothetical_startup_idea',
    header: 'Hypothetical Startup Idea',
    cell: ({ row }) => row.getValue('hypothetical_startup_idea') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'timeline_to_start',
    header: 'Timeline to Start',
    cell: ({ row }) => row.getValue('timeline_to_start') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'skillset',
    header: 'Skillset',
    cell: ({ row }) => row.getValue('skillset') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'skillset_extra',
    header: 'Additional Skills',
    cell: ({ row }) => row.getValue('skillset_extra') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'additional_interests',
    header: 'Additional Interests',
    cell: ({ row }) => row.getValue('additional_interests') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'desired_introductions',
    header: 'Desired Introductions',
    cell: ({ row }) => row.getValue('desired_introductions') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'long_term_goal',
    header: 'Long Term Goal',
    cell: ({ row }) => row.getValue('long_term_goal') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'sentiment',
    header: 'Sentiment',
    cell: ({ row }) => row.getValue('sentiment') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'summary',
    header: 'Summary',
    cell: ({ row }) => row.getValue('summary') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'transcript',
    header: 'Transcript',
    cell: ({ row }) => row.getValue('transcript') || '—',
    enableHiding: true,
  },
  {
    accessorKey: 'credibility_score',
    header: 'Credibility Score',
    cell: ({ row }) => {
      const score = row.getValue('credibility_score') as number | null
      return score !== null && score !== undefined 
        ? score.toFixed(3) 
        : '—'
    },
    enableHiding: true,
  },
  {
    accessorKey: 'submitted_at',
    header: 'Submitted',
    cell: ({ row }) => {
      const date = row.getValue('submitted_at')
      if (!date) return '—'
      // Format date using native JavaScript Date
      const d = new Date(date as string)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    },
    enableHiding: true,
  },
  {
    accessorKey: 'completed',
    header: 'Completed',
    cell: ({ row }) => {
      return row.getValue('completed') ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          No
        </span>
      )
    },
    enableHiding: true,
  },
] 