export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[450px] py-4 px-4">
        <p className="text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} ImpactPay. Built for MiniPay.
        </p>
      </div>
    </footer>
  );
}
