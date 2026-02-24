import { FILTER_CATEGORIES } from '../constants/expenseConstants';

function CategoryFilter({ filterCategory, setFilterCategory }) {
  const handleChange = (event) => {
    setFilterCategory(event.target.value);
  };

  return (
    <div className="filter-row">
      <label className="filter-label" htmlFor="category-filter">
        Category
      </label>
      <select
        id="category-filter"
        className="input filter-select"
        value={filterCategory}
        onChange={handleChange}
        aria-label="Filter expenses by category"
      >
        {FILTER_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CategoryFilter;