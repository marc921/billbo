import { Link } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "text-sm font-semibold text-white border border-white/60 hover:bg-white/10 hover:border-white rounded-md px-3 py-1 transition-colors",
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  children: React.ReactNode;
};

type LinkProps = ButtonBaseProps & {
  to: string;
  onClick?: never;
};

type ButtonProps = ButtonBaseProps & {
  to?: never;
  onClick: () => void;
};

export function Button(props: LinkProps | ButtonProps) {
  if (props.to) {
    return (
      <Link to={props.to} className={buttonVariants()}>
        {props.children}
      </Link>
    );
  }

  return (
    <button onClick={props.onClick} className={buttonVariants()}>
      {props.children}
    </button>
  );
}
