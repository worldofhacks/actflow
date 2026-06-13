import { updateUserRoleInCookies } from '@/actions/role';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Role, User } from '@/types/user';
import {
  Bell,
  Bot,
  CheckSquare,
  LogOut,
  MessageCircle,
  UserCircle,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

export const ProfilePopup = ({
  role,
  children,
  user,
  handleSignOut,
}: {
  role: Role;
  children: React.ReactNode;
  user: User | undefined;
  handleSignOut: () => Promise<void>;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
    <DropdownMenuContent className="w-72 border  rounded-2xl shadow-lg" align="end">
      <div className="p-4">
        <p className="text-white">{user?.name ?? 'AI User Name'}</p>
        <p className="text-sm text-gray-400">{user?.email ?? 'AI User Email'}</p>
      </div>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <div className="flex items-center gap-x-3.5">
            {role === Role.User ? (
              <UserCircle className="h-4 w-4" />
            ) : role === Role.Agent ? (
              <Bot className="h-4 w-4" />
            ) : (
              <CheckSquare className="h-4 w-4" />
            )}
            {role.at(0)?.toUpperCase() + role.slice(1)}
          </div>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-[200px]" sideOffset={5}>
          <DropdownMenuLabel className="text-white text-xs">Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={role}
            onValueChange={role => updateUserRoleInCookies(role as Role)}
          >
            <DropdownMenuRadioItem value={Role.User}>
              <div className="flex items-center gap-x-2">
                <UserCircle className="h-4 w-4" />
                User
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={Role.Agent}>
              <div className="flex items-center gap-x-2">
                <Bot className="h-4 w-4" />
                Agent
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={Role.Validator}>
              <div className="flex items-center gap-x-2">
                <CheckSquare className="h-4 w-4" />
                Validator
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={`/wallet`} className="w-full flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/notifications`} className="w-full flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/chat`} className="w-full flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>AI Chat</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup className="py-2">
        <DropdownMenuItem
          className="w-full flex items-center space-x-2 text-red-400"
          onClick={async () => await handleSignOut()}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);
