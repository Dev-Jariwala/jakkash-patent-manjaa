/* eslint-disable react/prop-types */
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "@/hooks/authProvider";
import Signin from "@/pages/signin/Signin";
// import Layout from "@/components/sidebar/Layout";
import Products from "@/pages/products/Products";
import ProductForm from "@/pages/products/components/ProductForm";
import Bills from "@/pages/bills.js/Bills";
import BillsForm from "@/pages/bills.js/components/BillsForm";
import Stocks from "@/pages/stocks/Stock";
import StocksForm from "@/pages/stocks/components/StocksForm";
import BillsView from "@/pages/bills.js/components/BillsView";
import Clients from "@/pages/clients/Clients";
import Purchases from "@/pages/purchases/Purchases";
import Analytics from "@/pages/analytics/Analytics";
import PurchaseForm from "@/pages/purchases/components/PurchaseForm";
import BillsReport from "@/pages/bills.js/components/BillsReport";
import StocksReport from "@/pages/stocks/components/StocksReport";
import PurchasesReport from "@/pages/purchases/components/PurchasesReport";
import ProductsReport from "@/pages/products/components/ProductsReport";
import Collections from "@/pages/collections/Collections";
import CollectionForm from "@/pages/collections/components/CollectionForm";
import ClientReport from "@/pages/clients/components/ClientReport";
import ClientForm from "@/pages/clients/components/ClientForm";
import Sidebar from "@/components/ui/sidebar/Sidebar";
import Dashboard from "@/pages/dashboard/Dashboard";
import Landing from "@/pages/landing/Landing";
import Settings from "@/pages/settings/Settings";
import Masters from "@/pages/masters/Masters";
import { LegacyBillsPathRedirect, LegacyBillsRedirect } from "@/routes/LegacyBillsRedirect";

const Routes = () => {
  const { token } = useAuth();

  // Define public routes accessible to all users
  const routesForPublic = [
    {
      path: "*",
      element: <div>Page not found</div>,
    },
  ];

  // Define routes accessible only to authenticated users
  const routesForAuthenticatedOnly = [
    {
      path: "/",
      element: <Sidebar />,
      children: [
        {
          path: "/",
          element: <ProtectedRoute />, // Wrap the component in ProtectedRoute
          children: [
            {
              path: "/",
              element: <Dashboard />,
            },
            {
              path: '/collections',
              element: <Collections />
            },
            {
              path: '/collections/new',
              element: <CollectionForm />
            },
            {
              path: '/collections/update',
              element: <CollectionForm />
            },
            {
              path: "/products",
              element: <Products />,
            },
            {
              path: "/products/new",
              element: <ProductForm />,
            },
            {
              path: "/products/update",
              element: <ProductForm />,
            },
            {
              path: "/products/report",
              element: <ProductsReport />,
            },
            {
              path: "/stocks",
              element: <Stocks />,
            },
            {
              path: "/stocks/new",
              element: <StocksForm />,
            },
            {
              path: "/stocks/update",
              element: <StocksForm />,
            },
            {
              path: "/stocks/report",
              element: <StocksReport />,
            },
            {
              path: "/bills",
              element: <LegacyBillsPathRedirect to="/orders/retail" />,
            },
            {
              path: "/bills/new",
              element: <LegacyBillsPathRedirect to="/orders/new" />,
            },
            {
              path: "/bills/view",
              element: <LegacyBillsPathRedirect to="/orders/view" />,
            },
            {
              path: "/bills/:orderType/report",
              element: <LegacyBillsRedirect />,
            },
            {
              path: "/bills/update/:order_id",
              element: <LegacyBillsRedirect />,
            },
            {
              path: "/bills/:orderType",
              element: <LegacyBillsRedirect />,
            },
            {
              path: "/orders",
              element: <Navigate to={'/orders/retail'} />,
            },
            {
              path: "/orders/new",
              element: <BillsForm />,
            },
            {
              path: "/orders/view",
              element: <BillsView />,
            },
            {
              path: '/orders/:orderType/report',
              element: <BillsReport />
            },
            {
              path: "/orders/update/:order_id",
              element: <BillsForm />,
            },
            {
              path: "/orders/:orderType",
              element: <Bills />,
            },
            {
              path: "/clients",
              element: <Clients />,
            },
            {
              path: "/clients/new",
              element: <ClientForm />,
            },
            {
              path: "/clients/edit/:mobile",
              element: <ClientForm />,
            },
            {
              path: '/clients/report',
              element: <ClientReport />
            },
            {
              path: '/purchases',
              element: <Purchases />
            },
            {
              path: "/analytics",
              element: <Analytics />,
            },
            {
              path: "/masters",
              element: <Masters />,
            },
            {
              path: "/settings",
              element: <Settings />,
            },
            {
              path: '/purchases/new',
              element: <PurchaseForm />
            },
            {
              path: '/purchases/update',
              element: <PurchaseForm />
            },
            {
              path: '/purchases/report',
              element: <PurchasesReport />
            }
          ],
        },
      ],
    },
  ];

  // Define routes accessible only to non-authenticated users
  const routesForNotAuthenticatedOnly = [
    {
      path: "/",
      element: <Landing />
    },
    {
      path: "/signin",
      element: <Signin />,
    },
  ];

  // Combine and conditionally include routes based on authentication status
  const router = createBrowserRouter([
    ...routesForPublic,
    ...(!token ? routesForNotAuthenticatedOnly : []),
    ...routesForAuthenticatedOnly,
  ]);

  // Provide the router configuration using RouterProvider
  return <RouterProvider router={router} />;
};

export default Routes;
