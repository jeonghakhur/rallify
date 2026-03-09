import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  className?: string;
};
export function Container({ children, className }: Props) {
  return <main className={clsx('px-5 pb-10', className)}>{children}</main>;
}
