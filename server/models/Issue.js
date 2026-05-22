import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    building: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    reporterEmail: { type: String, default: 'anonymous' },
    status: { type: String, default: 'New' },
    comments: { type: [String], default: [] },
    reportedAt: { type: Date, default: Date.now },
    locationGeo: {
      lat: String,
      lon: String,
      displayName: String
    },
    resolvedAt: Date
  },
  {
    timestamps: true
  }
);

const Issue = mongoose.models.Issue || mongoose.model('Issue', issueSchema);
export default Issue;
