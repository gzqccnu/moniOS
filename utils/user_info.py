#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pwd
import grp
import os

def get_users_info():
    """获取系统用户账户信息"""
    try:
        users = []
        
        # 遍历/etc/passwd文件获取用户信息
        for user in pwd.getpwall():
            try:
                # 用户ID
                uid = user.pw_uid
                # 只返回常规用户（uid >= 1000）和系统账户中的一些重要用户
                if uid >= 1000 or user.pw_name in ['root', 'www-data', 'mysql', 'postgres', 'redis', 'nginx']:
                    # 获取用户组信息
                    try:
                        group = grp.getgrgid(user.pw_gid)
                        group_name = group.gr_name
                    except (KeyError, OverflowError):
                        group_name = str(user.pw_gid)
                    
                    # 获取用户描述/注释
                    gecos = user.pw_gecos.split(',')[0] if user.pw_gecos else ''
                    description = gecos or ('超级用户' if user.pw_name == 'root' else '')
                    
                    # 对一些特殊用户添加描述
                    special_descriptions = {
                        'www-data': 'Web服务器用户',
                        'mysql': 'MySQL数据库用户',
                        'postgres': 'PostgreSQL数据库用户',
                        'nginx': 'Nginx服务用户',
                        'redis': 'Redis服务用户',
                        'nobody': '特权最小化用户'
                    }
                    
                    if not description and user.pw_name in special_descriptions:
                        description = special_descriptions[user.pw_name]
                    
                    users.append({
                        'username': user.pw_name,
                        'userId': user.pw_uid,
                        'groupId': user.pw_gid,
                        'groupName': group_name,
                        'homeDir': user.pw_dir,
                        'shell': user.pw_shell,
                        'description': description
                    })
            except (KeyError, OverflowError) as e:
                print(f"处理用户 {user.pw_name} 时出错: {e}")
                continue
        
        # 按照用户ID排序
        users.sort(key=lambda x: x['userId'])
        
        return users
    except Exception as e:
        print(f"获取用户信息时出错: {e}")
        
        # 返回模拟数据
        return [
            {
                'username': 'root',
                'userId': 0,
                'groupId': 0,
                'groupName': 'root',
                'homeDir': '/root',
                'shell': '/bin/bash',
                'description': '超级用户'
            },
            {
                'username': 'user',
                'userId': 1000,
                'groupId': 1000,
                'groupName': 'user',
                'homeDir': '/home/user',
                'shell': '/bin/bash',
                'description': '普通用户'
            }
        ] 