import { DEV_MODE, DEV_USER } from '@/lib/dev-mode'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Topic from '@/models/Topic'
import { redirect, notFound } from 'next/navigation'
import { formatPKR } from '@/lib/utils'
import SafepayCheckoutButton from '@/components/SafepayCheckoutButton'
import RapidGatewayCheckoutButton from '@/components/RapidGatewayCheckoutButton'
import JazzCashCheckoutButton from '@/components/JazzCashCheckoutButton'
import Purchase from '@/models/Purchase'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Lock, BookOpen, Video } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default async function BuyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let userId: string | null = null

  if (DEV_MODE) {
    userId = DEV_USER.userId
  } else {
    const { auth } = await import('@clerk/nextjs/server')
    const session = await auth()
    userId = session.userId
    if (!userId) redirect('/sign-in')
  }

  if (!userId) redirect('/sign-in')

  await connectDB()

  // Always assume buying a Unit (Chapter model)
  const item = await Chapter.findById(id).lean()
  if (!item || !item.isPublished) notFound()
  if (item.isFree) redirect(`/courses/${item.courseId}`)

  // Load topics for this unit to show what they are getting
  const topics = await Topic.find({ unitId: id, isPublished: true }).sort({ order: 1 }).lean()

  const { isSuperAdmin } = await import('@/lib/auth')
  if (await isSuperAdmin()) {
    redirect(`/courses/${item.courseId}`)
  }

  const existing = await Purchase.findOne({
    userId,
    chapterId: id,
  }).lean() as any

  let isExpired = false
  if (existing?.status === 'approved' && existing.expiresAt) {
    if (existing.expiresAt < new Date()) {
      isExpired = true
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7ff] pb-20">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-[#27187e]/10 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <Link href={`/courses/${item.courseId}`} className="text-[#3a86ff] hover:text-[#27187e] transition-colors flex items-center gap-1 font-bold text-sm w-fit">
            <ArrowLeft size={16} /> Back to Course
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-[#27187e]">Complete your purchase</h1>
          <p className="text-[#4A5043]/70">You are buying access to a single unit for 15 days.</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT: Payment form / Status */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#27187e]/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#27187e] to-[#3a86ff]" />
              
              <div className="mb-6 pb-6 border-b border-gray-100 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#3a86ff]/10 flex items-center justify-center text-[#3a86ff] shrink-0">
                  <Lock size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#27187e] mb-1">Secure Checkout</h2>
                  <p className="text-[#4A5043]/70 text-sm">Choose your preferred payment gateway</p>
                </div>
              </div>

              <div>
                {existing && existing.status === 'approved' && !isExpired ? (
                  <div className="text-center py-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={48} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-[#27187e] mb-3">✅ Active Access</h3>
                    <p className="text-[#4A5043] mb-8 text-lg">You already have active access to this unit.</p>
                    <Link href={`/courses/${item.courseId}`} className="bg-[#27187e] text-white px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-md inline-flex items-center gap-2">
                      View Content
                    </Link>
                  </div>
                ) : (
                  <>
                    {isExpired && (
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-bold flex items-center gap-2">
                        <Clock size={16} /> Your previous access has expired. Please renew.
                      </div>
                    )}
                    <SafepayCheckoutButton
                      itemId={id}
                      itemType="chapter"
                    />

                    {/* OR Divider */}
                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-bold text-[#4A5043]/50 uppercase tracking-widest">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <RapidGatewayCheckoutButton
                      itemId={id}
                      itemType="chapter"
                    />

                    {/* OR Divider */}
                    <div className="flex items-center gap-3 my-1 mt-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-bold text-[#4A5043]/50 uppercase tracking-widest">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <JazzCashCheckoutButton
                      itemId={id}
                      itemType="chapter"
                    />
                  </>
                )}
              </div>
            </div>

            {(!existing || existing.status !== 'approved' || isExpired) && (
              <div className="bg-[#27187e] rounded-2xl p-6 flex justify-between items-center text-white shadow-md">
                <div>
                  <span className="block text-[#f7f7ff]/70 text-sm font-bold uppercase tracking-wider mb-1">Total Due</span>
                  <span className="text-sm font-medium">15 days access</span>
                </div>
                <span className="font-black text-3xl">{formatPKR(item.price)}</span>
              </div>
            )}
          </div>

          {/* RIGHT: Perks / Included Details */}
          <div className="flex flex-col">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#27187e]/10 shadow-sm h-full">
              <h3 className="text-xl font-black text-[#27187e] mb-4 flex items-center gap-2">
                <BookOpen size={20} /> What's Included
              </h3>
              
              <p className="text-[#4A5043] mb-6 font-medium">You are purchasing a single unit. This grants you <strong className="text-[#27187e]">15 days of access</strong> to watch all {topics.length} video topics in this unit.</p>
              
              <div className="bg-[#f7f7ff] p-5 rounded-2xl border border-gray-100 mb-6">
                <h4 className="font-black text-[#27187e] mb-2">{item.title}</h4>
                {item.description && <p className="text-sm text-[#4A5043] whitespace-pre-wrap">{item.description}</p>}
              </div>

              {topics.length > 0 ? (
                <>
                  <h4 className="font-bold text-[#27187e] mb-3 text-sm uppercase tracking-wider">Included Topics</h4>
                  <ul className="flex flex-col gap-2">
                    {topics.map((t: any) => (
                      <li key={t._id.toString()} className="flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                        <span className="w-6 h-6 rounded-md bg-[#3a86ff]/10 text-[#3a86ff] flex items-center justify-center text-xs font-black shrink-0"><Video size={12} /></span>
                        <span className="font-bold text-[#4A5043] text-sm truncate">{t.title}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="text-center py-6 text-gray-400 font-medium">No topics available yet.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
