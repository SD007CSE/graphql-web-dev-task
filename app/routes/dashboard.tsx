import { json, redirect, type LoaderFunctionArgs, createCookie } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GraphQLClient, gql } from "graphql-request";

// Optionally keep the user query if your API supports it
const USER_QUERY = gql`
  query Me {
    me {
      email
    }
  }
`;

// Use fields from schema: documentId, Name, DOB, email, phone, is_active, createdAt, updatedAt, publishedAt
const USERS_QUERY = gql`
  query {
    userDbs {
      documentId
      Name
      DOB
      email
      phone
      is_active
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

interface MeQueryResponse {
  me: {
    email: string;
  };
}

interface User {
  documentId: string;
  Name: string;
  DOB: string | null;
  email: string;
  phone: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface UsersQueryResponse {
  userDbs: User[];
}

const tokenCookie = createCookie("token", {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  // secure: true, // Uncomment in production
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = await tokenCookie.parse(cookieHeader);
  console.log("Parsed token:", token);
  if (!token) {
    return redirect("/login");
  }

  const client = new GraphQLClient("https://api-qa.seamasterai.com/graphql", {
    headers: { Authorization: `Bearer ${token}` },
  });

  try {
    // Users fetch
    const usersRes = await client.request<UsersQueryResponse>(USERS_QUERY);

    // Optionally fetch user "me" as well if needed
    // const meRes = await client.request<MeQueryResponse>(USER_QUERY);

    return json({
      // user: meRes.me,
      users: usersRes.userDbs,
    });
  } catch (err) {
    console.error("Failed to fetch data:", err);
    return json(
      { error: "Failed to fetch user data. Please try again or contact support." },
      { status: 500 }
    );
  }
};

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  if ("error" in data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-3xl font-extrabold mb-4 text-gray-800">Dashboard</h1>
        <p className="text-red-500 text-lg bg-white rounded shadow p-4">{data.error}</p>
      </div>
    );
  }

  const { users } = data;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-2">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-8 relative">
        {/* Logout button top right */}
        <form method="post" action="/logout" className="absolute top-8 right-8">
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-full shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Logout
          </button>
        </form>
        <h1 className="text-3xl font-extrabold mb-2 text-indigo-700 text-center">User Dashboard</h1>
        <h2 className="text-lg font-semibold mb-6 text-gray-500 text-center">All Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="sticky top-0 border-b px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">ID</th>
                <th className="sticky top-0 border-b px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                <th className="sticky top-0 border-b px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                <th className="sticky top-0 border-b px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Phone</th>
                <th className="sticky top-0 border-b px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Active</th>
                <th className="sticky top-0 border-b px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">DOB</th>
                <th className="sticky top-0 border-b px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.documentId}
                  className={
                    idx % 2 === 0
                      ? "bg-white hover:bg-indigo-50 transition-colors"
                      : "bg-gray-50 hover:bg-indigo-50 transition-colors"
                  }
                >
                  <td className="border-b px-6 py-3 text-sm text-gray-700 font-mono">{u.documentId}</td>
                  <td className="border-b px-6 py-3 text-sm text-gray-900 font-semibold">{u.Name}</td>
                  <td className="border-b px-6 py-3 text-sm text-blue-700 underline">{u.email}</td>
                  <td className="border-b px-6 py-3 text-sm text-gray-700">{u.phone}</td>
                  <td className="border-b px-6 py-3 text-sm">
                    <span className={u.is_active ? "inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold" : "inline-block px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold"}>
                      {u.is_active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="border-b px-6 py-3 text-sm text-gray-700">{u.DOB || <span className="text-gray-400">N/A</span>}</td>
                  <td className="border-b px-6 py-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
