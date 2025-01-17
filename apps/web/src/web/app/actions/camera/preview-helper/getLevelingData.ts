import deviceMaster from 'helpers/device-master';

const getLevelingData = async (
  type: 'hexa_platform' | 'bottom_cover' | 'offset'
): Promise<{ [key: string]: number }> => {
  try {
    const data = await deviceMaster.fetchAutoLevelingData(type);
    return data;
  } catch (e) {
    console.log('Failed to getLevelingData', e);
    return { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0 };
  }
};

export default getLevelingData;
