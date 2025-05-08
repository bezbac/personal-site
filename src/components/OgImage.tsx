export default function OgImage({ title }: { title: string }) {
  return (
    <div
      style={{
        // TODO: Load this color from the tailwind config
        background: "#141414",
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "64px",
          paddingBottom: "128px",
          width: "100%",
          height: "100%",
          color: "white",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{ fontSize: "48px", fontWeight: "bold", textWrap: "balance" }}
        >
          Ben Bachem
        </span>
        <span
          style={{ fontSize: "72px", fontWeight: "bold", textWrap: "balance" }}
        >
          {title}
        </span>
      </div>
    </div>
  );
}
