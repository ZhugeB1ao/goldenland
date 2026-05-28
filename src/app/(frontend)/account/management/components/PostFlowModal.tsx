'use client'

import { useState } from 'react'
import PostPopUp1 from './PostPopUp1'
import PostPopUp2 from './PostPopUp2'
import PostPopUp3 from './PostPopUp3'
import { INITIAL_POST_DRAFT, type PostDraft } from './postFlowTypes'

type PostFlowModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function PostFlowModal({ isOpen, onClose }: PostFlowModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [draft, setDraft] = useState<PostDraft>(INITIAL_POST_DRAFT)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div className="flex h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-zinc-200">
            <div
              className={`h-full bg-red-600 transition-all ${
                step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
              }`}
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Phase {step}/3</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {step === 1 ? (
            <PostPopUp1
              draft={draft}
              onChange={setDraft}
              onClose={onClose}
              onNext={() => setStep(2)}
            />
          ) : null}

          {step === 2 ? (
            <PostPopUp2 onBack={() => setStep(1)} onClose={onClose} onNext={() => setStep(3)} />
          ) : null}

          {step === 3 ? (
            <PostPopUp3 onBack={() => setStep(2)} onClose={onClose} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
