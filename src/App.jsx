
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const App = () => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenses, setExpenses] = useState(() => {
    try {
      const savedExpenses = localStorage.getItem("expenses");
      return savedExpenses ? JSON.parse(savedExpenses) : [];
    } catch (error) {
      console.error("Failed to load expenses:", error);
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
    );

  const [errors, setErrors] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Calculate total expenses
  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  // Calculate transaction count
  const transactionCount = expenses.length;

  // Handle form submission and validation
  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = {
      description: "",
      amount: "",
      category: "",
    };

    // Validate description
    if (!description.trim()) {
      validationErrors.description =
        "Please enter a description.";
    }

    // Validate amount
    const numericAmount = Number(amount);

    if (amount.trim() === "") {
      validationErrors.amount = "Please enter an amount.";
    } else if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      validationErrors.amount =
        "Please enter an amount greater than zero.";
    }

    // Validate category
    if (!category) {
      validationErrors.category =
        "Please select a category.";
    }
    
    if (!date) {
      validationErrors.date = "Please select a date.";
    }

    // Update validation errors
    setErrors(validationErrors);

    // Stop submission if there are errors
    const hasErrors = Object.values(validationErrors).some(
      (error) => error !== ""
    );

    if (hasErrors) {
      return;
    }

    // Create the new expense
    const newExpense = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: numericAmount,
      category,
      date,
    };

    // Add expense to the existing list
    if (editingId) {
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === editingId
            ? { ...expense, ...newExpense, id: editingId }
            : expense
        )
      );

      setEditingId(null);
    } else {
      setExpenses((prevExpenses) => [
        ...prevExpenses,
        newExpense,
      ]);
    }

    // Reset form fields after successful submission
    setDescription("");
    setAmount("");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);

    // Clear validation errors
    setErrors({
      description: "",
      amount: "",
      category: "",
    });
  };

  const handleDelete = (id) => {
    setExpenses((prevExpenses) =>
      prevExpenses.filter((expense) => expense.id !== id)
    );
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      expense.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedExpenses = filteredExpenses.toSorted((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.date.localeCompare(a.date);

      case "oldest":
        return a.date.localeCompare(b.date);

      case "highest":
        return b.amount - a.amount;

      case "lowest":
        return a.amount - b.amount;

      default:
        return 0;
    }
  });

  const monthlyExpenses = expenses.filter((expense) =>
    expense.date.startsWith(selectedMonth)
  );

  const monthlyTotal = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const monthlyTransactionCount = monthlyExpenses.length;

  const categoryTotals = monthlyExpenses.reduce((totals, expense) => {
    totals[expense.category] =
      (totals[expense.category] || 0) + Number(expense.amount);

    return totals;
  }, {});

  const chartData = Object.entries(categoryTotals).map(
    ([category, total]) => ({
      category:
        category.charAt(0).toUpperCase() + category.slice(1),
      amount: total,
    })
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="rounded-xl bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white">
          Expense Tracker
        </h1>
        <p className="mt-1 text-gray-400">
          Take control of your spending
        </p>
      </header>

      <main className="space-y-6">
        {/* Expense summary */}
        <section
          aria-label="Expense summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-medium text-gray-500">
              Total expenses
            </h2>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              ${totalExpenses.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-medium text-gray-500">
              Transactions
            </h2>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {transactionCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <label
              htmlFor="summary-month"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Select month
            </label>

            <input
              id="summary-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-auto"
            />

            <div className="rounded-xl border border-gray-200 bg-white p-6 my-2">
              <h2 className="text-sm font-medium text-gray-500">
                Selected month's spending
              </h2>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                ${monthlyTotal.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-medium text-gray-500">
                Transactions this month
              </h2>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {monthlyTransactionCount}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Spending by category
            </h2>

            <div className="mt-4 space-y-4">
              {Object.entries(categoryTotals).length === 0 ? (
                <p className="text-sm text-gray-500">
                  No expenses for this month yet.
                </p>
              ) : (
                Object.entries(categoryTotals).map(([category, total]) => (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-gray-700">
                        {category}
                      </span>

                      <span className="text-sm font-semibold text-gray-900">
                        ${total.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{
                          width: `${
                            (total /
                              Math.max(...Object.values(categoryTotals))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly spending chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 col-span-2">
            <h2 className="text-lg font-bold text-gray-900">
              Monthly spending by category
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Spending breakdown for the selected month
            </p>

            {chartData.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">
                No expenses to display for this month.
              </p>
            ) : (
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      tickFormatter={(value) => `$${value}`}
                      width={65}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `$${Number(value).toFixed(2)}`,
                        "Spending",
                      ]}
                    />

                    <Bar
                      dataKey="amount"
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Add expense form */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Add an expense
          </h2>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <input
                id="description"
                type="text"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    description: "",
                  }));
                }}
                placeholder="e.g. Groceries"
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description
                    ? "description-error"
                    : undefined
                }
                className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 ${
                  errors.description
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-indigo-500"
                }`}
              />

              {errors.description && (
                <p
                  id="description-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Amount */}
              <div>
                <label
                  htmlFor="amount"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Amount
                </label>

                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      amount: "",
                    }));
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  aria-invalid={Boolean(errors.amount)}
                  aria-describedby={
                    errors.amount
                      ? "amount-error"
                      : undefined
                  }
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 ${
                    errors.amount
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-indigo-500"
                  }`}
                />

                {errors.amount && (
                  <p
                    id="amount-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {errors.amount}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      category: "",
                    }));
                  }}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={
                    errors.category
                      ? "category-error"
                      : undefined
                  }
                  className={`w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 ${
                    errors.category
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-indigo-500"
                  }`}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="housing">Housing</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>

                {errors.category && (
                  <p
                    id="category-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Expense date
                </label>

                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-700 sm:w-auto"
            >
              {editingId ? "Update expense" : "Add expense"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDescription("");
                  setAmount("");
                  setCategory("");
                  setDate(new Date().toISOString().split("T")[0]);
                  setErrors({
                    description: "",
                    amount: "",
                    category: "",
                    date: "",
                  });
                }}
                className="ml-2 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel edit
              </button>
            )}
          </form> 
        </section>

        {/* Recent expenses */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Recent expenses
          </h2>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search expenses..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 my-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 my-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All categories</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="housing">Housing</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none my-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </select>

          <div className="space-y-4">
            {filteredExpenses.length === 0 ? (
              <p className="text-sm text-gray-500">
                No expenses yet. Add your first expense above.
              </p>
            ) : (
              sortedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {expense.description}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {expense.category}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(expense.date + "T00:00:00").toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {expense.id}
                    </p>
                  </div>

                  <p className="font-semibold text-gray-900">
                    ${Number(expense.amount).toFixed(2)}
                  </p>

                   <button
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${expense.description}`}
                   >
                    Delete
                   </button>
                   <button
                    type="button"
                    onClick={() => {
                      setEditingId(expense.id);
                      setDescription(expense.description);
                      setAmount(String(expense.amount));
                      setCategory(expense.category);
                      setDate(expense.date);
                    }}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
