import "./ExcalidrawLogo.scss";

// Replacing the complex SVG component with a simple Image component
const LogoIcon = () => (
  <img 
    src="https://iili.io/fbcp4tf.png" 
    alt="BD Preparation Hub Logo" 
    className="ExcalidrawLogo-icon"
    style={{ objectFit: "contain" }}
  />
);

// Replacing the SVG text with actual text
const LogoText = () => (
  <span className="ExcalidrawLogo-text-custom">
    BD Preparation Hub
  </span>
);

type LogoSize = "xs" | "small" | "normal" | "large" | "custom" | "mobile";

interface LogoProps {
  size?: LogoSize;
  withText?: boolean;
  style?: React.CSSProperties;
  isNotLink?: boolean;
}

export const ExcalidrawLogo = ({
  style,
  size = "small",
  withText,
}: LogoProps) => {
  return (
    <div className={`ExcalidrawLogo is-${size}`} style={{ display: "flex", alignItems: "center", ...style }}>
      <LogoIcon />
      {withText && <LogoText />}
    </div>
  );
};