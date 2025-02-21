import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn duration-300 ease-out">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-md w-full"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-amber-500/20 p-3 rounded-full mb-4">
                <AlertTriangle size={28} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Submit for Review
              </h3>
              <p className="text-gray-400">
                Once submitted, you won't be able to edit this content again until the reviewers are done.
                Are you sure you want to proceed?
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-700 text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onProceed}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Proceed
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionModal;
