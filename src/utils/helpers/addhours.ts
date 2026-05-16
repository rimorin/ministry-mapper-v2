const addHours = (numOfHours: number, date = new Date()) => {
  return new Date(date.getTime() + numOfHours * 60 * 60 * 1000).toISOString();
};

export default addHours;
