export interface CliIO {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
}

export const defaultCliIO: CliIO = {
  stdout: (line: string) => {
    process.stdout.write(`${line}\n`);
  },
  stderr: (line: string) => {
    process.stderr.write(`${line}\n`);
  }
};
