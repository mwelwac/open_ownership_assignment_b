import { Link } from "react-router-dom";

export function PortalBrand() {
  return (
    <Link
      to="/applications"
      className="flex shrink-0 items-center rounded-lg pr-1 outline-none focus-visible:ring-2 focus-visible:ring-[#224d8e] focus-visible:ring-offset-2"
    >
      <span>
        <span className="block text-base leading-5 font-semibold tracking-[-0.01em] text-[#102a56]">
          CaseMan
        </span>
        <span className="block text-xs leading-4 text-[#667085]">Case management</span>
      </span>
    </Link>
  );
}
