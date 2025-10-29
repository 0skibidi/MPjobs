import { Query } from 'mongoose';

interface QueryString {
  [key: string]: string | undefined;
}

export class APIFeatures<T> {
  constructor(
    public query: Query<T[], T>,
    private queryString: QueryString
  ) {}

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'q'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  search() {
    if (this.queryString.q) {
      const searchQuery = this.queryString.q;
      this.query = this.query.find({
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { skills: { $regex: searchQuery, $options: 'i' } }
        ]
      });
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page || '1');
    const limit = parseInt(this.queryString.limit || '10');
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
} 