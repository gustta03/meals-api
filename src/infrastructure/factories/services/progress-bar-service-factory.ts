import { ProgressBarService } from "../../services/progress-bar.service";

export const makeProgressBarService = (): ProgressBarService => {
  return new ProgressBarService();
};



