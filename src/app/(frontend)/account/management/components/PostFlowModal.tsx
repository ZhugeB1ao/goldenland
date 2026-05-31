'use client'

import { useEffect, useRef, useState } from 'react'
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
  const draftImagesRef = useRef(draft.images)

  const resetDraftImages = () => {
    draft.images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
  }

  const handleClose = () => {
    resetDraftImages()
    setDraft(INITIAL_POST_DRAFT)
    setStep(1)
    onClose()
  }

  useEffect(() => {
    draftImagesRef.current = draft.images
  }, [draft.images])

  useEffect(() => {
    return () => {
      draftImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div className="flex h-[90vh] w-[min(96vw,1400px)] flex-col overflow-x-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className={`h-full bg-red-600 transition-all ${
                step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
              }`}
            />
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
          {step === 1 ? (
            <PostPopUp1
              draft={draft}
              onChange={setDraft}
              onClose={handleClose}
              onNext={() => setStep(2)}
            />
          ) : null}

          {step === 2 ? (
            <PostPopUp2
              draft={draft}
              onChange={setDraft}
              onBack={() => setStep(1)}
              onClose={handleClose}
              onNext={() => setStep(3)}
            />
          ) : null}

          {step === 3 ? (
            <PostPopUp3 draft={draft} onBack={() => setStep(2)} onClose={handleClose} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
