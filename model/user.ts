export type AuthUser = {
  id: string;
  name: string;
  userName: string;
  email: string;
  image?: string;
  level: number;
  gender: string;
};

export type SimpleUser = Pick<AuthUser, 'id' | 'userName' | 'image'>;

export type HomeUser = AuthUser & {
  following: SimpleUser[];
  followers: SimpleUser[];
  bookmarks: string[];
};

export type SearchUser = SimpleUser & {
  following: number;
  followers: number;
};

export type ProfileUser = SearchUser & {
  name: string;
  posts: number;
};

export type UserProps = {
  email: string;
  id: string;
  image?: string | null;
  name: string;
  username: string;
  provider: string | null;
  level: number;
  gender: string;
  phone_number: string | null;
  birthday: string | null;
  address: string | null;
  birthyear: string | null;
};

export type SimpleUserProps = Omit<UserProps, 'id' | 'birthday'>;
