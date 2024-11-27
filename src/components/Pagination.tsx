import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center space-x-2 mt-6"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={clsx(
          "p-2 rounded-lg transition-all duration-200",
          currentPage === 1
            ? "text-gray-500 cursor-not-allowed"
            : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
        )}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </motion.button>

      <div className="flex items-center space-x-1">
        {getPageNumbers().map((pageNumber, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
            disabled={pageNumber === '...'}
            className={clsx(
              "relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200",
              {
                'bg-purple-500 text-white': pageNumber === currentPage,
                'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10':
                  pageNumber !== currentPage && pageNumber !== '...',
                'text-gray-500 cursor-default': pageNumber === '...',
              }
            )}
          >
            {pageNumber === currentPage && (
              <motion.div
                layoutId="activePage"
                className="absolute inset-0 bg-purple-500 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{pageNumber}</span>
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={clsx(
          "p-2 rounded-lg transition-all duration-200",
          currentPage === totalPages
            ? "text-gray-500 cursor-not-allowed"
            : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
        )}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
};

export default Pagination;
