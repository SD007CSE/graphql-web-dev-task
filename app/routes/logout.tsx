import { ActionFunctionArgs, redirect, createCookie } from "@remix-run/node";

const tokenCookie = createCookie("token", {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  // secure: true, // Uncomment in production
});

export const action = async ({ request }: ActionFunctionArgs) => {
  // Clear the token cookie
  return redirect("/login", {
    headers: {
      "Set-Cookie": await tokenCookie.serialize("", { maxAge: 0 }),
    },
  });
};

// No default export: this is an action-only route. 