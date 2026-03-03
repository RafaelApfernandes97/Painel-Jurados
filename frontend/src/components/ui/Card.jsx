export default function Card({ children, className = "" }) {
  return <section className={`panel p-5 sm:p-6 ${className}`}>{children}</section>;
}
