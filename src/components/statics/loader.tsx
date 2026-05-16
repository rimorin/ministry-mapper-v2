const Loader: React.FC = () => {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className="fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden bg-primary/15"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-[shimmer_1.4s_ease-in-out_infinite] motion-reduce:animate-none" />
    </div>
  );
};

export default Loader;
