export const getDateFromPreset = (preset: string) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  switch (preset) {
    case "today":
      return {
        start: formatDate(today),
        end: formatDate(today),
      };
    case "yesterday":
      return {
        start: formatDate(yesterday),
        end: formatDate(yesterday),
      };
    case "last7days":
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return {
        start: formatDate(last7),
        end: formatDate(today),
      };
    case "last30days":
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return {
        start: formatDate(last30),
        end: formatDate(today),
      };
    case "thisMonth":
      return {
        start: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: formatDate(today),
      };
    case "lastMonth":
      return {
        start: formatDate(
          new Date(today.getFullYear(), today.getMonth() - 1, 1)
        ),
        end: formatDate(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    case "thisYear":
      return {
        start: formatDate(new Date(today.getFullYear(), 0, 1)),
        end: formatDate(today),
      };
    case "lastYear":
      return {
        start: formatDate(new Date(today.getFullYear() - 1, 0, 1)),
        end: formatDate(new Date(today.getFullYear() - 1, 11, 31)),
      };
    default:
      return { start: "", end: "" };
  }
};

const formatDate = (date: Date) => date.toISOString().split("T")[0];
