import { getDocs, collection, where, query } from "firebase/firestore";
import { firestore } from "../../firebase";
import { LinkSession } from "../policies";

const getAssignments = async (user: string, congregation: string) => {
  const assignments = new Array<LinkSession>();
  const snapshot = await getDocs(
    query(
      collection(firestore, `links`),
      where("congregation", "==", congregation),
      where("userId", "==", user)
    )
  );

  for (const assignment of snapshot.docs) {
    const assignmentData = assignment.data();
    assignments.push(
      new LinkSession({
        userId: assignmentData.userId,
        tokenCreatetime: assignmentData.tokenCreatetime,
        congregation: assignmentData.congregation,
        name: assignmentData.name,
        publisherName: assignmentData.publisherName,
        tokenEndtime: assignmentData.tokenEndtime,
        mapId: assignmentData.mapId,
        linkType: assignmentData.linkType,
        maxTries: assignmentData.maxTries
      })
    );
  }
  return assignments;
};

export default getAssignments;
