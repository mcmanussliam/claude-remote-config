export interface RemoteRuleAsset {
  kind: 'rule';
  remotePath: string;
  relativeOutputPath: string;
  content: string;
}

export interface RemoteCommandAsset {
  kind: 'command';
  remotePath: string;
  relativeOutputPath: string;
  commandName: string;
  content: string;
}

export interface RemoteSkillFile {
  remotePath: string;
  relativeOutputPath: string;
  content: string;
}

export interface RemoteSkillAsset {
  kind: 'skill';
  remotePath: string;
  relativeOutputPath: string;
  name: string;
  generatedName: string;
  files: RemoteSkillFile[];
}

export interface RemoteJsonAsset {
  remotePath: string;
  value: unknown;
}

export interface RemoteTreeSelection {
  rules: RemoteRuleAsset[];
  commands: RemoteCommandAsset[];
  skills: RemoteSkillAsset[];
  settings?: RemoteJsonAsset;
  hooks?: RemoteJsonAsset;
  skipped: Array<{ path: string; reason: string }>;
}
