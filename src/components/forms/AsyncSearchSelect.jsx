import AsyncSelect from "react-select/async";

export default function AsyncSearchSelect({
  loadOptions,
  value,
  onChange,
  placeholder = "Buscar...",
}) {
  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      noOptionsMessage={() => "Sin resultados"}
    />
  );
}
