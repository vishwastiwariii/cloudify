export function ModalBackdrop({
  onClose,
  children,
  width = "max-w-[520px]",
}: {
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-80 flex items-center justify-center bg-[#14120e]/52 p-7 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${width} rounded-[30px] bg-paper shadow-[0_60px_120px_-50px_rgba(20,18,14,0.8)]`}
      >
        {children}
      </div>
    </div>
  );
}
