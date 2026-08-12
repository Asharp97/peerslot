export const appointmentDurationOptions = fiveMinuteOptions(10, 120);
export const restTimeOptions = fiveMinuteOptions(0, 120);

export function isFiveMinuteOption(
  value: number,
  minimum: number,
  maximum: number,
) {
  return (
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum &&
    value % 5 === 0
  );
}

function fiveMinuteOptions(minimum: number, maximum: number) {
  return Object.freeze(
    Array.from(
      { length: (maximum - minimum) / 5 + 1 },
      (_, index) => minimum + index * 5,
    ),
  );
}
