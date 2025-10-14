import React from 'react'
import { Contact } from '../../types'

interface ContactDetailModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact
  onUpdate: (contact: Contact) => void
}

export default function ContactDetailModal({
  isOpen,
  onClose,
  contact: _contact,
  onUpdate: _onUpdate
}: ContactDetailModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Contact Details</h2>
        <p className="text-gray-600 mb-4">
          Detailed contact view temporarily disabled for deployment.
        </p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}