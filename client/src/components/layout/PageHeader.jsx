/* eslint-disable react/prop-types */
import { pageHeaderClass, pageTitleClass } from "@/lib/theme-colors";

export function PageHeader({ children, actions }) {
  return (
    <div className={pageHeaderClass}>
      <div className={pageTitleClass}>{children}</div>
      {actions}
    </div>
  );
}
