import Image from "next/image";
import styles from "./BrandLogo.module.css";

export default function BrandLogo({
  variant = "transparent",
}: {
  variant?: "transparent" | "white";
}) {
  return (
    <span
      className={`${styles.logo} ${variant === "white" ? styles.white : ""}`}
    >
      <Image
        src="/brand/mfcs-transparent.png"
        alt="Monmouth Fidelity Chinese School"
        width={105}
        height={95}
        loading="eager"
      />
    </span>
  );
}
