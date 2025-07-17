import { json, redirect, type ActionFunctionArgs, createCookie } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { GraphQLClient, gql } from "graphql-request";
import { useEffect } from "react";

const LOGIN_MUTATION = gql`
  mutation Login($input: UsersPermissionsLoginInput!) {
    login(input: $input) {
      jwt
      user {
        id
        username
        email
      }
    }
  }
`;

// Define the expected response type
interface LoginResponse {
  login: {
    jwt: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

const tokenCookie = createCookie("token", {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  // secure: true, // Uncomment this in production (HTTPS)
  encode: String,
  decode: String,
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const identifier = formData.get("identifier");
  const password = formData.get("password");
  if (typeof identifier !== "string" || typeof password !== "string") {
    return json({ error: "Invalid form data" }, { status: 400 });
  }
  const client = new GraphQLClient("https://api-qa.seamasterai.com/graphql");
  try {
    const data = await client.request<LoginResponse>(LOGIN_MUTATION, {
      input: {
        identifier,
        password,
      },
    });
    const token = data.login.jwt;
    const setCookie = await tokenCookie.serialize(token);
    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": setCookie,
      },
    });
  } catch (error: any) {
    return json({ error: error.response?.errors?.[0]?.message || "Login failed" }, { status: 401 });
  }
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-800">Sign in to your account</h1>
        <p className="text-gray-500 mb-6 text-center w-full">Welcome back! Please enter your details.</p>
        <Form method="post" className="space-y-5 w-full">
          <div>
            <input
              name="identifier"
              type="email"
              placeholder="Email"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white text-black"
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white text-black"
            />
          </div>
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm animate-shake">
              {actionData.error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold p-3 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Login
          </button>
        </Form>
        <div className="flex items-center w-full my-6">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <a
          href="/signup"
          className="text-blue-600 hover:underline font-medium text-sm"
        >
          Don't have an account? Sign up
        </a>
      </div>
    </div>
  );
} 