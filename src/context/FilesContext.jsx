import { createContext, useContext, useState } from "react";
import { DUMMY_FILES } from "../utils/dummyData";
import { createFile } from "../services/filesService";
const FilesContext = createContext(null);

export function FilesProvider({ children }) {
  const [files, setFiles] = useState(DUMMY_FILES);

  const revokeAccess = (fileNumber, { userId, teamId }) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.fileNumber !== fileNumber) return f;
        const denied = f.deniedAccess ?? { userIds: [], teamIds: [] };
        return {
          ...f,
          deniedAccess: {
            userIds: userId && !denied.userIds.includes(userId)
              ? [...denied.userIds, userId]
              : denied.userIds,
            teamIds: teamId && !denied.teamIds.includes(teamId)
              ? [...denied.teamIds, teamId]
              : denied.teamIds,
          },
        };
      })
    );
  };

  const restoreAccess = (fileNumber, { userId, teamId }) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.fileNumber !== fileNumber) return f;
        const denied = f.deniedAccess ?? { userIds: [], teamIds: [] };
        return {
          ...f,
          deniedAccess: {
            userIds: userId ? denied.userIds.filter((id) => id !== userId) : denied.userIds,
            teamIds: teamId ? denied.teamIds.filter((id) => id !== teamId) : denied.teamIds,
          },
        };
      })
    );
  };



const addFile = async (newFile) => {
  const res = await createFile(newFile);
  setFiles((prev) => [res.file, ...prev]);
};

  const updateFile = (updatedFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.fileNumber === updatedFile.fileNumber ? { ...f, ...updatedFile } : f
      )
    );
  };

  return (
    <FilesContext.Provider value={{ files, addFile, revokeAccess, restoreAccess, updateFile }}>
      {children}
    </FilesContext.Provider>
  );
}

export const useFiles = () => useContext(FilesContext);
