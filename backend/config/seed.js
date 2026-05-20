import Village from '../models/Village.js';

const seedVillages = async () => {
  try {
    const count = await Village.countDocuments();
    if (count === 0) {
      const defaultVillages = [
        { name: 'యెల్లంపెట' },
        { name: 'మంచతాండ' },
        { name: 'లక్ష్మతాండ' },
        { name: 'విసంపల్లి' },
        { name: 'ఉగంపల్లి' },
        { name: 'సోమలతండ' },
        { name: 'బోట్యాతండ' },
        { name: 'ముడుతండ' }
      ];
      await Village.insertMany(defaultVillages);
      console.log('Default Telugu villages seeded successfully!');
    }
  } catch (error) {
    console.error(`Seeding villages failed: ${error.message}`);
  }
};

export default seedVillages;
