import mongoose from 'mongoose';
import { Lecture } from '../src/models/lecture.model';
import { Section } from '../src/models/section.model';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/nextera');
  const cid = '6a757e821a24e148c5f65e49';
  const sid = '6a757e821a24e148c5f65e52';
  const s = await Section.findById(sid).lean();
  console.log('section:', s && s.title, '| totalLectures field:', s && s.totalLectures);
  const lectures = await Lecture.find({ section: sid }).lean();
  console.log('lectures via find:', lectures.length);
  const [agg] = await Lecture.aggregate([
    { $match: { section: sid as any } },
    { $group: { _id: null, totalLectures: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
  ]).then((r) => (r.length ? r : [{ totalLectures: 0, totalDuration: 0 }]));
  console.log('aggregate (string):', JSON.stringify(agg));
  const [agg2] = await Lecture.aggregate([
    { $match: { section: new mongoose.Types.ObjectId(sid) } },
    { $group: { _id: null, totalLectures: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
  ]).then((r) => (r.length ? r : [{ totalLectures: 0, totalDuration: 0 }]));
  console.log('aggregate (ObjectId):', JSON.stringify(agg2));
  await mongoose.disconnect();
}
main().catch((e) => { console.error('ERR', e); process.exit(1); });
