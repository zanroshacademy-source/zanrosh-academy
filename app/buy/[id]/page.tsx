import { DEV_MODE, DEV_USER } from '@/lib/dev-mode'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import { redirect, notFound } from 'next/navigation'
import { formatPKR } from '@/lib/utils'
import PaymentForm from '@/components/PaymentForm'
import Purchase from '@/models/Purchase'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Lock, BookOpen } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default async function BuyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const type = resolvedSearchParams?.type === 'chapter' ? 'chapter' : 'course'

  let userId: string | null = null
  let userEmail = 'student@maqbool.pk'

  if (DEV_MODE) {
    userId = DEV_USER.userId
    userEmail = DEV_USER.emailAddresses[0].emailAddress
  } else {
    const { auth, currentUser } = await import('@clerk/nextjs/server')
    const session = await auth()
    userId = session.userId
    if (!userId) redirect('/sign-in')
    const clerkUser = await currentUser()
    userEmail = clerkUser?.emailAddresses[0]?.emailAddress || userEmail
  }

  if (!userId) redirect('/sign-in')

  let item: any = null
  let existing: any = null

  if (DEV_MODE) {
    // mock logic handled elsewhere, just use DB for now
  }

  await connectDB()

  let courseChapters: any[] = []

  if (type === 'course') {
    item = await Course.findById(id).lean()
    if (!item || !item.isPublished) notFound()
    if (item.isFree) redirect(`/courses/${id}`)
    courseChapters = await Chapter.find({ courseId: id, isPublished: true }).sort({ order: 1 }).lean()
  } else {
    item = await Chapter.findById(id).lean()
    if (!item || !item.isPublished) notFound()
    if (item.isFree) redirect(`/watch/${id}`)
  }
  
  // Check if super_admin
  const { isSuperAdmin } = await import('@/lib/auth')
  if (await isSuperAdmin()) redirect(type === 'course' ? `/courses/${id}` : `/watch/${id}`)

  // Check if existing purchase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = type === 'course' 
    ? { userId, courseId: id, status: { $in: ['approved', 'pending'] } }
    : { userId, chapterId: id, status: { $in: ['approved', 'pending'] } }
  
  existing = await Purchase.findOne(query).lean()

  // Also check if they bought the full course already (if they are trying to buy a chapter)
  if (type === 'chapter' && !existing) {
    const coursePurchase = await Purchase.findOne({
      userId,
      courseId: item.courseId,
      status: 'approved'
    }).lean()
    if (coursePurchase) {
      redirect(`/watch/${id}`) // They already own the full course
    }
  }

  const backLink = type === 'course' ? `/courses/${id}` : `/courses/${item.courseId}`

  return (
    <div className="min-h-screen bg-[#f7f7ff]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-20">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-[#4A5043] hover:text-[#27187e] font-semibold text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#27187e] font-bold uppercase tracking-wider text-sm mb-3">
            <Lock size={16} /> Secure Checkout
          </div>
          <h1 className="text-3xl font-black text-[#27187e] mb-2">Unlock {item.title}</h1>
          <p className="text-[#4A5043] text-lg">
            Purchase this {type} to instantly unlock its contents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Checkout Form */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#27187e]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="relative z-10">
                {existing ? (
                  <div className="text-center py-12">
                    {existing.status === 'approved' ? (
                      <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl font-black text-[#27187e] mb-3">✅ Already Purchased</h3>
                        <p className="text-[#4A5043] mb-8 text-lg">You already have full access to this {type}.</p>
                        <Link href={type === 'course' ? `/courses/${id}` : `/watch/${id}`} className="bg-[#27187e] text-white px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-md inline-flex items-center gap-2">
                          View Content
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Clock size={48} className="text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-black text-[#27187e] mb-3">⏳ Payment Pending</h3>
                        <p className="text-[#4A5043] mb-8 text-lg">Your payment is awaiting admin approval. Please check back in a few hours.</p>
                        <Link href="/dashboard" className="bg-[#27187e] text-white px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-md inline-flex items-center gap-2">
                          View Dashboard
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <PaymentForm
                    itemId={id}
                    itemType={type}
                    itemTitle={item.title}
                    price={item.price}
                    userEmail={userEmail}
                  />
                )}
              </div>
            </div>

            {!existing && (
              <div className="bg-[#27187e] rounded-2xl p-6 flex justify-between items-center text-white shadow-xl">
                <div>
                  <span className="block text-[#f7f7ff]/70 text-sm font-bold uppercase tracking-wider mb-1">Total Due</span>
                  <span className="text-sm font-medium">One-time payment</span>
                </div>
                <span className="font-black text-3xl">{formatPKR(item.price)}</span>
              </div>
            )}
          </div>

          {/* RIGHT: Perks / Included Details */}
          <div className="flex flex-col">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] h-full">
              <h3 className="text-xl font-black text-[#27187e] mb-4 flex items-center gap-2">
                <BookOpen size={20} /> What's Included
              </h3>
              
              {type === 'course' ? (
                <>
                  <p className="text-[#4A5043] mb-6 font-medium">By purchasing the full course, you get permanent access to all {courseChapters.length} chapters:</p>
                  <ul className="flex flex-col gap-3">
                    {courseChapters.map((ch, idx) => (
                      <li key={ch._id.toString()} className="flex items-start gap-3 bg-[#f7f7ff] p-3 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-[#27187e]/10 text-[#27187e] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{idx + 1}</span>
                        <div>
                          <p className="font-bold text-[#27187e] leading-tight">{ch.title}</p>
                          {ch.description && <p className="text-xs text-[#4A5043] mt-1 line-clamp-2">{ch.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {courseChapters.length === 0 && (
                    <div className="text-center py-6 text-gray-400 font-medium">No chapters available yet.</div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[#4A5043] mb-6 font-medium">You are purchasing a single chapter. This grants you permanent access to watch the video content for this chapter.</p>
                  <div className="bg-[#f7f7ff] p-5 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#27187e] mb-2">{item.title}</h4>
                    <p className="text-sm text-[#4A5043] whitespace-pre-wrap">{item.description || 'No description available for this chapter.'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
