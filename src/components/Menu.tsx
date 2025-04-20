export default function Menu(props: React.PropsWithChildren) {
  return (
    <div className="relative group inline-flex subtitle text-neutral-380 hover:text-black hover:bg-neutral-820 rounded p-0.5 px-1 cursor-pointer">
      <div>{props.children}</div>
      <div className="hidden group-hover:block absolute top-0 left-0 pt-7">
        <div className="relative bg-neutral-230 border border-neutral-310 rounded z-50 shadow-2xl">
          <ul className="grid whitespace-nowrap">
            <li className="w-full">
              <a
                className="hover:text-accent cursor-pointer text-neutral-640 outline-none hover:bg-neutral-310 px-2 py-1"
                href="/"
              >
                / home
              </a>
            </li>
            <li className="w-full">
              <a
                className="hover:text-accent cursor-pointer text-neutral-640 outline-none hover:bg-neutral-310 px-2 py-1"
                href="/blog"
              >
                / writing
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
