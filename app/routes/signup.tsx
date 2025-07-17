// app/routes/signup.tsx
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { GraphQLClient, gql } from "graphql-request";

const SIGNUP_MUTATION = gql`
  mutation Register($input: UsersPermissionsRegisterInput!) {
    register(input: $input) {
      jwt
      user {
        id
        username
        email
        confirmed
        role {
          id
          name
          description
          type
        }
      }
    }
  }
`;

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return json({ error: "Invalid form data" }, { status: 400 });
  }

  const client = new GraphQLClient("https://api-qa.seamasterai.com/graphql");

  try {
    const data = await client.request<any>(SIGNUP_MUTATION, {
      input: {
        username,
        email,
        password,
      },
    });
    const jwt = data.register?.jwt;
    if (!jwt) {
      return json({ error: "Signup failed: No token returned." }, { status: 401 });
    }

    // Set session cookie (secure in production)
    const expires = new Date(Date.now() + 7*24*60*60*1000).toUTCString();
    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": `token=${jwt}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`,
      },
    });
  } catch (error: any) {
    console.error(error);
    const apiError = error.response?.errors?.[0]?.message || "Signup failed";
    return json({ error: apiError }, { status: 401 });
  }
};

export default function Signup() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-800">Create your account</h1>
        <p className="text-gray-500 mb-6 text-center w-full">Sign up to get started!</p>
        <Form method="post" className="space-y-5 w-full">
          <div>
            <input
              name="username"
              type="text"
              placeholder="Username"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white text-black"
            />
          </div>
          <div>
            <input
              name="email"
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
            Sign Up
          </button>
        </Form>
        <div className="flex items-center w-full my-6">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <a
          href="/login"
          className="text-blue-600 hover:underline font-medium text-sm"
        >
          Already have an account? Login
        </a>
      </div>
    </div>
  );
}
