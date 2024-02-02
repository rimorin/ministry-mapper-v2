import { firestore } from "../../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const getOptions = async (code: string) => {
  const snapshot = await getDocs(
    query(
      collection(firestore, `congregations/${code}/options`),
      orderBy("sequence")
    )
  );

  const options = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      code: data.code,
      description: data.description,
      isCountable: data.is_countable,
      isDefault: data.is_default,
      sequence: data.sequence
    };
  });

  return options;
};

export default getOptions;
