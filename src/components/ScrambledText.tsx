import { useScramble } from "use-scramble";

export default function ScrambledText(props: { text: string }) {
  const { ref, replay } = useScramble({
    text: props.text,
    speed: 0.25,
    scramble: 5,
    seed: 100,
  });

  return (
    <span onMouseEnter={() => replay()} ref={ref}>
      &nbsp;
    </span>
  );
}
