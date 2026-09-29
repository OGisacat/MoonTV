import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

type AuthorizedUser = {
  ok: true;
  username: string;
};

type UnauthorizedUser = {
  ok: false;
  response: NextResponse;
};

function authFailure(error: string, reason: string): UnauthorizedUser {
  return {
    ok: false,
    response: NextResponse.json(
      { error },
      {
        status: 401,
        headers: {
          'X-Auth-Failure-Reason': reason,
        },
      }
    ),
  };
}

export async function authorizeDataApiUser(
  request: NextRequest
): Promise<AuthorizedUser | UnauthorizedUser> {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo?.username) {
    return authFailure('Unauthorized', 'route_missing_identity');
  }

  const username = authInfo.username;

  // 站长账号由环境变量定义，不依赖数据库用户列表。
  if (username === process.env.USERNAME) {
    return { ok: true, username };
  }

  const config = await getConfig();
  const configuredUser = config.UserConfig.Users.find(
    (user) => user.username === username
  );

  if (configuredUser?.banned) {
    return authFailure('用户已被封禁', 'route_user_banned');
  }

  if (!configuredUser) {
    // 兼容历史 Upstash 账号：老账号可能有 u:<username>:pwd，
    // 但没有进入较新的 sys:users / UserConfig.Users 索引。
    const existsInStorage = await db.checkUserExist(username);
    if (!existsInStorage) {
      return authFailure('用户不存在', 'route_user_not_found');
    }
  }

  return { ok: true, username };
}
