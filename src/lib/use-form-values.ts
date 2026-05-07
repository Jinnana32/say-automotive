"use client";

import { useCallback, useState } from "react";

export function useFormValues<T>(initialValues: T) {
  const [values, setValues] = useState(initialValues);

  const updateFormValue = useCallback(function updateFormValue<Key extends keyof T>(
    key: Key,
    value: T[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }, []);

  return {
    values,
    setValues,
    updateFormValue,
  };
}
